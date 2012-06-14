require "date"

class Fixnum
  def ordinalize
    if (11..13).include?(self % 100)
      "#{self}th"
    else
      case self % 10
        when 1; "#{self}st"
        when 2; "#{self}nd"
        when 3; "#{self}rd"
        else    "#{self}th"
      end
    end
  end

  def to_abbr_month_name
    Date.new(Time.now.year, self, Time.now.day).strftime("%b")
  end
end